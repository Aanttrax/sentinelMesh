import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';

/** Reserved for future PATCH operations (e.g. partial field updates). */
export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
