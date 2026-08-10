// Add new teams here only; challengeCatalog.ts imports this and stays unchanged.

export type TeamKey =
  | 'redbull.salzburg'
  | 'redbull.leipzig'
  | 'redbull.new-york-red-bulls'
  | 'redbull.bragantino'
  | 'city.manchester-city'
  | 'city.girona'
  | 'city.new-york-city'
  | 'city.melbourne-city'
  | 'city.troyes'
  | 'vaduz'
  | 'blueco.chelsea'
  | 'blueco.strasbourg'
  | 'nottingham-forest'
  | 'arsenal'
  | 'atletico-madrid'
  | 'roma'
  | 'benfica'
  | 'ajax'
  | 'celtic'
  | 'fulham'
  | 'freiburg'
  | 'brighton'
  | 'union-berlin'
  | 'watford'
  | 'cd-maldonado'
  | 'fc-andorra'
  | 'ad-ceuta'
  | 'cardiff-city'
  | 'swansea-city'
  | 'wrexham'
  | 'rapid-wien'
  | 'austria-wien'
  | 'slovan-bratislava'
  | 'ferencvaros'
  | 'ujpest'
  | 'mtk-budapest'
  | 'budapest-honved'
  | 'red-star-belgrade'
  | 'partizan-belgrade'
  | 'dynamo-dresden'
  | 'hansa-rostock'
  | 'fc-magdeburg'
  | 'energie-cottbus'
  | 'erzgebirge-aue';

export type TeamResolverEntry = {
  readonly names: readonly string[];
  readonly countryCodes: readonly string[];
};

export const TEAM_RESOLVER: Record<TeamKey, TeamResolverEntry> = {
  'redbull.salzburg':           { names: ['Red Bull Salzburg', 'FC Red Bull Salzburg', 'RB Salzburg', 'Salzburg'],          countryCodes: ['AUT', 'AT'] },
  'redbull.leipzig':            { names: ['RB Leipzig', 'RasenBallsport Leipzig', 'Leipzig'],                                countryCodes: ['DEU', 'DE'] },
  'redbull.new-york-red-bulls': { names: ['New York Red Bulls', 'NY Red Bulls', 'New York RB'],                              countryCodes: ['USA', 'US'] },
  'redbull.bragantino':         { names: ['Red Bull Bragantino', 'RB Bragantino', 'Bragantino'],                             countryCodes: ['BRA', 'BR'] },
  'city.manchester-city':       { names: ['Manchester City', 'Man City'],                                                    countryCodes: ['ENG', 'GBR', 'UK'] },
  'city.girona':                { names: ['Girona', 'Girona FC'],                                                            countryCodes: ['ESP', 'ES'] },
  'city.new-york-city':         { names: ['New York City', 'New York City FC', 'NYCFC'],                                     countryCodes: ['USA', 'US'] },
  'city.melbourne-city':        { names: ['Melbourne City', 'Melbourne City FC'],                                            countryCodes: ['AUS', 'AU'] },
  'city.troyes':                { names: ['Troyes', 'ESTAC Troyes', 'ES Troyes AC'],                                         countryCodes: ['FRA', 'FR'] },
  'vaduz':                      { names: ['Vaduz', 'FC Vaduz'],                                                              countryCodes: ['LIE', 'LI', 'CHE', 'CH'] },
  'blueco.chelsea':             { names: ['Chelsea', 'Chelsea FC'],                                                          countryCodes: ['ENG', 'GBR', 'UK'] },
  'blueco.strasbourg':          { names: ['Strasbourg', 'RC Strasbourg', 'RC Strasbourg Alsace'],                            countryCodes: ['FRA', 'FR'] },
  'nottingham-forest':          { names: ['Nottingham Forest', 'Nottingham Forest FC'],                                      countryCodes: ['GB-ENG', 'ENG', 'GBR', 'UK'] },
  'arsenal':                    { names: ['Arsenal', 'Arsenal FC'],                                                          countryCodes: ['GB-ENG', 'ENG', 'GBR', 'UK'] },
  'atletico-madrid':            { names: ['Atletico Madrid', 'Atlético Madrid', 'Club Atletico de Madrid'],                  countryCodes: ['ES', 'ESP'] },
  'roma':                       { names: ['Roma', 'AS Roma', 'A.S. Roma'],                                                   countryCodes: ['IT', 'ITA'] },
  'benfica':                    { names: ['Benfica', 'SL Benfica', 'Sport Lisboa e Benfica'],                                countryCodes: ['PT', 'PRT'] },
  'ajax':                       { names: ['Ajax', 'AFC Ajax', 'Ajax Amsterdam'],                                             countryCodes: ['NL', 'NLD'] },
  'celtic':                     { names: ['Celtic', 'Celtic FC'],                                                            countryCodes: ['GB-SCT', 'SCO', 'GBR', 'UK'] },
  'fulham':                     { names: ['Fulham', 'Fulham FC'],                                                            countryCodes: ['GB-ENG', 'ENG', 'GBR', 'UK'] },
  'freiburg':                   { names: ['Freiburg', 'SC Freiburg'],                                                        countryCodes: ['DEU', 'DE'] },
  'brighton':                   { names: ['Brighton', 'Brighton & Hove Albion', 'Brighton and Hove Albion', 'Brighton & Hove Albion FC'], countryCodes: ['GB-ENG', 'ENG', 'GBR', 'UK'] },
  'union-berlin':               { names: ['Union Berlin', '1. FC Union Berlin', 'FC Union Berlin'],                         countryCodes: ['DEU', 'DE'] },
  'watford':                    { names: ['Watford', 'Watford FC'],                                                          countryCodes: ['GB-ENG', 'ENG', 'GBR', 'UK'] },
  'cd-maldonado':               { names: ['CD Maldonado', 'Deportivo Maldonado', 'Club Deportivo Maldonado'],                countryCodes: ['URY', 'UY'] },
  'fc-andorra':                 { names: ['FC Andorra', 'F.C. Andorra', 'Andorra FC', 'Andorra'],                           countryCodes: ['AND', 'AD', 'ESP', 'ES'] },
  'ad-ceuta':                   { names: ['AD Ceuta FC', 'AD Ceuta', 'Ceuta FC', 'Ceuta'],                                  countryCodes: ['ESP', 'ES'] },
  'cardiff-city':               { names: ['Cardiff City', 'Cardiff City FC', 'Cardiff'],                                     countryCodes: ['GB-WLS', 'WAL', 'GBR', 'UK', 'GB-ENG', 'ENG'] },
  'swansea-city':               { names: ['Swansea City', 'Swansea City AFC', 'Swansea'],                                   countryCodes: ['GB-WLS', 'WAL', 'GBR', 'UK', 'GB-ENG', 'ENG'] },
  'wrexham':                    { names: ['Wrexham', 'Wrexham AFC', 'Wrexham A.F.C.'],                                      countryCodes: ['GB-WLS', 'WAL', 'GBR', 'UK', 'GB-ENG', 'ENG'] },
  'rapid-wien':                 { names: ['Rapid Wien', 'SK Rapid Wien', 'Rapid Vienna'],                                    countryCodes: ['AUT', 'AT'] },
  'austria-wien':               { names: ['Austria Wien', 'FK Austria Wien', 'Austria Vienna'],                              countryCodes: ['AUT', 'AT'] },
  'slovan-bratislava':          { names: ['Slovan Bratislava', 'SK Slovan Bratislava'],                                      countryCodes: ['SVK', 'SK'] },
  'ferencvaros':                { names: ['Ferencváros', 'Ferencvaros', 'Ferencvárosi TC', 'Ferencvarosi TC', 'FTC'],       countryCodes: ['HUN', 'HU'] },
  'ujpest':                     { names: ['Újpest', 'Ujpest', 'Újpest FC', 'Ujpest FC'],                                    countryCodes: ['HUN', 'HU'] },
  'mtk-budapest':               { names: ['MTK Budapest', 'MTK', 'MTK Hungária FC'],                                        countryCodes: ['HUN', 'HU'] },
  'budapest-honved':            { names: ['Budapest Honvéd', 'Budapest Honved', 'Honvéd FC', 'Honved FC'],                  countryCodes: ['HUN', 'HU'] },
  'red-star-belgrade':          { names: ['Red Star Belgrade', 'FK Crvena zvezda', 'Crvena Zvezda', 'Crvena zvezda', 'Red Star'], countryCodes: ['SRB', 'RS'] },
  'partizan-belgrade':          { names: ['Partizan Belgrade', 'FK Partizan', 'Partizan'],                                  countryCodes: ['SRB', 'RS'] },
  'dynamo-dresden':             { names: ['Dynamo Dresden', 'SG Dynamo Dresden'],                                           countryCodes: ['DEU', 'DE'] },
  'hansa-rostock':              { names: ['Hansa Rostock', 'FC Hansa Rostock'],                                             countryCodes: ['DEU', 'DE'] },
  'fc-magdeburg':               { names: ['Magdeburg', '1. FC Magdeburg', 'FC Magdeburg'],                                  countryCodes: ['DEU', 'DE'] },
  'energie-cottbus':            { names: ['Energie Cottbus', 'FC Energie Cottbus'],                                         countryCodes: ['DEU', 'DE'] },
  'erzgebirge-aue':             { names: ['Erzgebirge Aue', 'FC Erzgebirge Aue', 'Aue'],                                   countryCodes: ['DEU', 'DE'] },
};

export function readTeamKey(value: unknown): TeamKey | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const normalized = value.trim().toLowerCase() as TeamKey;
  return normalized in TEAM_RESOLVER ? normalized : null;
}
