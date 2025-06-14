import { PeerAssessment, Question } from '../../drizzle/schema';
import { UserProtected } from '../../user/user.interface';

export interface PeerAssessmentWithQuestion {
  assessorStudentUserId: PeerAssessment['assessorStudentUserId'];
  score: PeerAssessment['score'];
  questionId: Question['questionId'];
  question: Question['question'];
  displayOrder: Question['displayOrder'];
}

export interface UserWithPeerAssessment extends UserProtected {
  ratings: PeerAssessmentWithQuestion[];
}

export type GetPeerAssessmentsByGroupIdResponse = Array<UserWithPeerAssessment>;

export interface AssessPeerResponse {
  assessedStudentUserId: PeerAssessment['assessedStudentUserId'];
}
