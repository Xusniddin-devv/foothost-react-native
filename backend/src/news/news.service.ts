import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './news.entity';
import { CreateNewsDto, UpdateNewsDto } from './dto/create-news.dto';

@Injectable()
export class NewsService {
  constructor(@InjectRepository(News) private repo: Repository<News>) {}

  findPublished(): Promise<News[]> {
    return this.repo.find({
      where: { published: true },
      order: { createdAt: 'DESC' },
    });
  }

  findAll(): Promise<News[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<News> {
    const news = await this.repo.findOne({ where: { id } });
    if (!news) throw new NotFoundException('News item not found');
    return news;
  }

  create(authorId: string, dto: CreateNewsDto): Promise<News> {
    return this.repo.save(this.repo.create({ ...dto, authorId }));
  }

  async update(id: string, dto: UpdateNewsDto): Promise<News> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async updateImage(id: string, imageUrl: string | null): Promise<News> {
    await this.repo.update(id, { imageUrl });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
