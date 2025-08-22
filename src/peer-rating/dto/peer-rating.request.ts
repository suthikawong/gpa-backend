import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Group, PeerRating } from '../../drizzle/schema';

export class GetPeerRatingsByScoringComponentIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  scoringComponentId: PeerRating['scoringComponentId'];

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];
}

class RatingItem {
  @IsInt()
  rateeStudentUserId: PeerRating['rateeStudentUserId'];

  @IsNumber()
  @Min(0)
  score: PeerRating['score'];

  @IsOptional()
  @IsString()
  comment?: PeerRating['comment'];
}

export class RatePeerRequest {
  @IsInt()
  scoringComponentId: PeerRating['scoringComponentId'];

  @IsInt()
  groupId: PeerRating['groupId'];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingItem)
  studentScores: RatingItem[];
}
