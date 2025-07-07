import { PeerRating } from '../../drizzle/schema';
import { UserProtected } from '../../user/user.interface';

export interface PeerRatingItem {
  raterStudentUserId: PeerRating['rateeStudentUserId'];
  score: PeerRating['score'];
  comment: PeerRating['comment'];
}

export interface UserWithPeerRating extends UserProtected {
  ratings: PeerRatingItem[];
}

export type GetPeerRatingsByScoringComponentIdResponse =
  Array<UserWithPeerRating>;

export interface RatePeerResponse {
  raterStudentUserId: PeerRating['raterStudentUserId'];
}
