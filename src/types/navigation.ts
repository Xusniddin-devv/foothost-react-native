export type RootStackParamList = {
  Onboarding: undefined;
  Register: undefined;
  Login: undefined;
  Main: undefined;
  Home: undefined;
  StadiumList: undefined;
  Tournaments: undefined;
  TournamentDetails: {
    tournament: {
      id: number;
      title: string;
      format: string;
      cost: string;
      location: string;
      participants: string;
      time: string;
      date: string;
      price: string;
      distance: string;
      surface: string;
      pitchType: string;
      dimensions: string;
      workTime: string;
      address: string;
      team1: string;
      team2: string;
    };
  };
  Profile: undefined;
  PersonalData: undefined;
  AboutUs: undefined;
  PhoneVerification: { phoneNumber: string };
  BookingStep1:
    | { showSchedule?: boolean; fieldId?: string; lobbyId?: string }
    | undefined;
  BookingStep2: { lobbyId?: string; fieldId?: string; fromProfile?: boolean } | undefined;
  PaymentScreen: { lobbyId?: string; amount?: number } | undefined;
  BookingStep3: { lobbyId?: string } | undefined;
  MatchRating: {
    matchId: string;
    teams: [string, string];
    eventName: string;
    date: string;
    fieldName: string;
  };
}; 