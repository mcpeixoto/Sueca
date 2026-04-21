package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Tournament struct {
	ID          string    `gorm:"primaryKey;type:uuid" json:"id"`
	Name        string    `json:"name"`
	Edition     string    `json:"edition"`
	Format      string    `json:"format"`
	TeamCount   int       `json:"teamCount"`
	PointsToWin int       `json:"pointsToWin"`
	LiveScore   bool      `json:"liveScore"`
	GroupsOf    int       `json:"groupsOf"`
	QrURL       string    `json:"qrUrl"`
	State       string    `gorm:"type:text" json:"state"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Teams       []Team    `gorm:"foreignKey:TournamentID;constraint:OnDelete:CASCADE" json:"teams"`
	Matches     []Match   `gorm:"foreignKey:TournamentID;constraint:OnDelete:CASCADE" json:"matches"`
}

func (t *Tournament) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.NewString()
	}
	return nil
}

type Team struct {
	ID           string `gorm:"primaryKey;type:uuid" json:"id"`
	TournamentID string `gorm:"index" json:"tournamentId"`
	Name         string `json:"name"`
	Player1      string `json:"p1"`
	Player2      string `json:"p2"`
	Wins         int    `json:"wins"`
	Losses       int    `json:"losses"`
	Pedras       int    `json:"pedras"`
	Points       int    `json:"points"`
	Eliminated   bool   `json:"eliminated"`
}

func (t *Team) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.NewString()
	}
	return nil
}

type Match struct {
	ID           string     `gorm:"primaryKey;type:uuid" json:"id"`
	TournamentID string     `gorm:"index" json:"tournamentId"`
	Round        int        `json:"round"`
	BracketSlot  int        `json:"bracketSlot"`
	GroupIdx     int        `json:"group"`
	TeamA        string     `json:"teamA"`
	TeamB        string     `json:"teamB"`
	ScoreA       int        `json:"scoreA"`
	ScoreB       int        `json:"scoreB"`
	Status       string     `json:"status"`
	Winner       string     `json:"winner"`
	MVP          string     `json:"mvp"`
	StartedAt    *time.Time `json:"startedAt"`
	FinishedAt   *time.Time `json:"finishedAt"`
}

func (m *Match) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.NewString()
	}
	return nil
}
