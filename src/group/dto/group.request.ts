import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { Group } from '../../drizzle/schema';

export class GetGroupByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  groupId: Group['groupId'];
}

export class CreateGroupRequest {
  @IsString()
  groupName: Group['groupName'];

  @IsNumber()
  assessmentId: Group['assessmentId'];
}

export class UpdateGroupRequest {
  @IsNumber()
  groupId: Group['groupId'];

  @IsString()
  groupName: Group['groupName'];
}

export class DeleteGroupRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  groupId: Group['groupId'];
}
