import Phaser from 'phaser';
import generateMap from '../map';
import Hero from '../entities/Hero';
import DarkLord from '../entities/DarkLord';

export default class GameScene extends Phaser.Scene {
  private hero!: Hero;
  private darkLord!: DarkLord;
  private goldGroup!: Phaser.Physics.Arcade.Group;

  constructor() {
    super('GameScene');
  }

  create() {
    // Generate the map (returns width and height)
    const { width, height } = generateMap(this);

    // set physics and camera bounds to map size
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);

    // create hero in the center of the map
    this.hero = new Hero(this, width / 2, height / 2);
    this.add.existing(this.hero);
    this.physics.add.existing(this.hero);

    // create dark lord controller
    this.darkLord = new DarkLord(this);
    this.add.existing(this.darkLord);

    // create gold coin group
     this.goldGroup = this.physics.add.group();

    // scatter coins across the map
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(32, width - 32);
      const y = Phaser.Math.Between(32, height - 32);
      const gold = this.physics.add.sprite(x, y, 'coin');
      gold.setData('value', 1);
      this.goldGroup.add(gold);
    }

    // overlap to collect coins
    this.physics.add.overlap(this.hero, this.goldGroup, (_hero: any, gold: any) => {
      gold.destroy();
      this.hero.addGold(1);
    });

    // follow hero with camera
    this.cameras.main.startFollow(this.hero);

    // handle pointer click to move hero
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.hero.moveTo(pointer.worldX, pointer.worldY);
    });
  }

  update(time: number, delta: number): void {
    if (this.hero && (this.hero as any).update) {
      (this.hero as any).update(time, delta);
    }
    if (this.darkLord && (this.darkLord as any).update) {
      (this.darkLord as any).update(time, delta);
    }
  }
}
