import { PeerRating } from '../../drizzle/schema';
import { UserProtected } from '../../user/user.interface';

export interface PeerRatingItem {
  rateeStudentUserId: PeerRating['rateeStudentUserId'];
  score: PeerRating['score'];
  comment: PeerRating['comment'];
}

export interface UserWithPeerRating extends UserProtected {
  ratings: PeerRatingItem[];
}

export type GetPeerRatingsByGroupIdResponse = Array<UserWithPeerRating>;

export interface RatePeerResponse {
  rateeStudentUserId: PeerRating['rateeStudentUserId'];
}
