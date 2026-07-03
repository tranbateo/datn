import { PartialType } from '@nestjs/mapped-types';
import { CreateChatRagDto } from './create-chat-rag.dto';

export class UpdateChatRagDto extends PartialType(CreateChatRagDto) {}
