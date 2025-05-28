import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { Group, PeerAssessment } from '../../drizzle/schema';

export class GetPeerAssessmentsByGroupIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];
}

class RatingItem {
  @IsInt()
  questionId: PeerAssessment['questionId'];

  @IsInt()
  @Min(0)
  @Max(5)
  score: PeerAssessment['score'];
}

export class AssessPeerRequest {
  @IsInt()
  assignmentId: PeerAssessment['assignmentId'];

  @IsInt()
  assessedStudentUserId: PeerAssessment['assessedStudentUserId'];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingItem)
  ratings: RatingItem[];
}
