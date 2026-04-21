export type VotingMethod = 'majority' | 'approval' | 'irv' | 'range' | 'qv';

export type SessionStatus = 'draft' | 'active' | 'closed';
export type ParticipantIdMode = 'anonymous' | 'nickname';
export type ResultVisibility = 'realtime' | 'after_end';

export interface Organizer {
  id: string;
  email: string;
  name: string;
  google_id: string | null;
  created_at: string;
}

export interface MethodsConfig {
  enabled: VotingMethod[];
  order: VotingMethod[];
  qv_credits: number;
  range_max: number;
}

export interface VotingSession {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  methods_config: MethodsConfig;
  participant_id_mode: ParticipantIdMode;
  result_visibility: ResultVisibility;
  share_token: string;
  status: SessionStatus;
  result_published: boolean;
  created_at: string;
  closed_at: string | null;
}

export interface Artwork {
  id: string;
  session_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  creator_name: string | null;
  display_order: number;
  created_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  participant_number: number;
  nickname: string | null;
  browser_id: string;
  joined_at: string;
  completed_at: string | null;
}

export type VoteData =
  | MajorityVoteData
  | ApprovalVoteData
  | IrvVoteData
  | RangeVoteData
  | QvVoteData;

export interface MajorityVoteData {
  artwork_id: string;
}

export interface ApprovalVoteData {
  artwork_ids: string[];
}

export interface IrvVoteData {
  rankings: Array<{ artwork_id: string; rank: number }>;
}

export interface RangeVoteData {
  scores: Record<string, number>;
}

export interface QvVoteData {
  credits: Record<string, number>;
}

export interface Vote {
  id: string;
  participant_id: string;
  method: VotingMethod;
  vote_data: VoteData;
  submitted_at: string;
}

export interface MetaVote {
  id: string;
  participant_id: string;
  approved_methods: VotingMethod[];
  none_selected: boolean;
  submitted_at: string;
}

export interface FreeComment {
  id: string;
  participant_id: string;
  comment_text: string;
  submitted_at: string;
}
