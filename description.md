# Mpira Metrics

## Metrics

### 1. Late Game Performance Networks
- **Clutch involvement**: Which players have events (goals/assists) in 75'+ minutes
- **Team collapse patterns**: Teams that concede multiple goals in final 15 minutes
- **Comeback kings**: Teams that score when trailing vs teams that fold

### 2. Player Involvement Efficiency
- **Event rate per appearance**: Total events (goals+assists+cards) / matches played
- **Involvement streaks**: Consecutive matches with at least one event
- **Position clustering**: Players who consistently create events vs those who disappear

### 3. Team Dependency Analysis
- **Single point of failure**: Teams where 50%+ of goals come from one player
- **Distributed attack**: Teams with 5+ players scoring (harder to defend against)
- **Creative burden**: Teams where 50%+ of assists come from one player

### 4. Match Flow Intelligence
- **Response time**: Average minutes between conceding and scoring response
- **Goal clusters**: Matches with 3+ goals in 15-minute spans (chaos vs control)
- **Clean sheet conversion**: Teams that score first and keep clean sheets vs those that concede after scoring

### 5. Competition Pattern Recognition
- **High-scoring fixtures**: Specific team matchups that consistently produce 3+ goals
- **Rivalry intensity**: Cards per match in specific team pairings
- **Venue effects**: Teams that perform differently at neutral venues vs home

### 6. Player Movement Impact
- **Transfer success**: Players who maintain event rate after changing teams
- **Team chemistry disruption**: Performance drop when key assist providers leave
- **Integration speed**: New players' time to first event with new team

---

## Database Schema

### Tables

#### `teams`
| Column | Type/Key | Notes |
| :--- | :--- | :--- |
| `id` | PK | |
| `name` | | |
| `short_name` | | |
| `logo_url` | | |
| `country` | | |

#### `competitions`
| Column | Type/Key | Notes |
| :--- | :--- | :--- |
| `id` | PK | |
| `name` | | e.g., Super League Malawi |
| `type` | | league, cup, friendly |
| `season` | | e.g., 2025/26 |

#### `matches`
| Column | Type/Key | Notes |
| :--- | :--- | :--- |
| `id` | PK | |
| `competition_id` | FK | References `competitions.id` |
| `date` | | |
| `home_team_id` | FK | References `teams.id` |
| `away_team_id` | FK | References `teams.id` |
| `score_home` | | |
| `score_away` | | |
| `venue` | | Optional |

#### `players`
| Column | Type/Key | Notes |
| :--- | :--- | :--- |
| `id` | PK | |
| `name` | | |
| `short_name` | | |
| `date_of_birth` | | |
| `nationality` | | |
| `photo_url` | | |
| `position` | | |

#### `player_team_history`
| Column | Type/Key | Notes |
| :--- | :--- | :--- |
| `id` | PK | |
| `player_id` | FK | References `players.id` |
| `team_id` | FK | References `teams.id` |
| `start_date` | | |
| `end_date` | | |

#### `match_events`
| Column | Type/Key | Notes |
| :--- | :--- | :--- |
| `id` | PK | |
| `match_id` | FK | References `matches.id` |
| `player_id` | FK | References `players.id` |
| `event_type` | | goal, yellow_card, red_card |
| `minute` | | |
| `assisting_player_id` | | |