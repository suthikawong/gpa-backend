import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Group, PeerRating } from '../../drizzle/schema';

export class GetPeerRatingsByGroupIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  scoringComponentId: PeerRating['scoringComponentId'];

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];
}

class RatingItem {
  @IsInt()
  @Min(0)
  @Max(5)
  score: PeerRating['score'];

  @IsOptional()
  @IsString()
  comment?: PeerRating['comment'];
}

export class RatePeerRequest {
  @IsInt()
  scoringComponentId: PeerRating['scoringComponentId'];

  @IsInt()
  rateeStudentUserId: PeerRating['rateeStudentUserId'];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingItem)
  studentScores: RatingItem[];
}
