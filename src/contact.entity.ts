import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({
  name: 'Contact',
})
export class ContactEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  phoneNumber?: string;

  @Column({
    type: 'varchar',
    length: 256,
    nullable: true,
  })
  email?: string;

  @Column({
    type: 'integer',
    nullable: true,
  })
  linkedId?: number;

  @OneToMany(() => ContactEntity, (c) => c.id)
  @JoinColumn({
    name: 'linkedId',
  })
  linkedContact?: ContactEntity;

  @Column({
    type: 'smallint',
    nullable: false,
    default: 1,
  })
  linkPrecedence: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
