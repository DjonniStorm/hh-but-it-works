import { randomBytes } from "node:crypto";

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import bcrypt from "bcrypt";
import { In, Repository } from "typeorm";

import { Role } from "@hh/types";

import { User } from "./user.entity";

const passwordCost = 10;

// Хеш случайной строки той же стоимости. С ним вход по несуществующей почте
// тратит на bcrypt столько же, сколько по существующей, и по времени ответа
// не узнать, зарегистрирован ли адрес.
const dummyPasswordHash = bcrypt.hashSync(
  randomBytes(16).toString("hex"),
  passwordCost,
);

const publicColumns = {
  id: true,
  email: true,
  role: true,
  consentAt: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({
      where: { email },
      select: publicColumns,
    });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({
      where: { id },
      select: publicColumns,
    });
  }

  findForLogin(email: string): Promise<User | null> {
    return this.users.findOne({
      where: { email },
      select: { ...publicColumns, passwordHash: true },
    });
  }

  async create(input: {
    email: string;
    password: string;
    role: Role;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(input.password, passwordCost);
    const user = await this.users.save(
      this.users.create({
        email: input.email,
        passwordHash,
        role: input.role,
        consentAt: new Date(),
        emailVerifiedAt: null,
      }),
    );
    return this.requireById(user.id);
  }

  async markEmailVerified(id: string): Promise<User> {
    await this.users.update(id, { emailVerifiedAt: new Date() });
    return this.requireById(id);
  }

  // Один хеш на всех: bcrypt медленный, а пароль у этих пользователей общий.
  async setPassword(ids: string[], password: string): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const passwordHash = await bcrypt.hash(password, passwordCost);
    await this.users.update({ id: In(ids) }, { passwordHash });
  }

  // Ссылка из письма доказывает, что почта своя: заодно считаем её подтверждённой.
  async resetPassword(user: User, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, passwordCost);
    await this.users.update(user.id, {
      passwordHash,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
    });
  }

  // null — почты нет. bcrypt всё равно считается, против подбора адресов по времени.
  async passwordMatches(user: User | null, password: string): Promise<boolean> {
    const matches = await bcrypt.compare(
      password,
      user?.passwordHash ?? dummyPasswordHash,
    );
    return user !== null && matches;
  }

  private async requireById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }
    return user;
  }
}
