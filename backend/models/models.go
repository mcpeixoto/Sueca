package models

import (
	"crypto/rand"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ"

type Tournament struct {
	ID           string    `gorm:"primaryKey;type:uuid" json:"id"`
	Code         string    `gorm:"uniqueIndex;size:4" json:"code"`
	AdminCode    string    `gorm:"uniqueIndex;size:6" json:"adminCode"`
	Name         string    `json:"name"`
	Edition      string    `json:"edition"`
	Format       string    `json:"format"`
	TeamCount    int       `json:"teamCount"`
	PointsToWin  int       `json:"pointsToWin"`
	PointsPerWin int       `json:"pointsPerWin"`
	Tiebreaker   string    `json:"tiebreaker"`
	LiveScore    bool      `json:"liveScore"`
	GroupsOf     int       `json:"groupsOf"`
	State        string    `gorm:"type:text" json:"state"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	Teams        []Team    `gorm:"foreignKey:TournamentID;constraint:OnDelete:CASCADE" json:"teams"`
	Matches      []Match   `gorm:"foreignKey:TournamentID;constraint:OnDelete:CASCADE" json:"matches"`
}

func (t *Tournament) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.NewString()
	}
	if t.Code == "" {
		code, err := uniqueCode(tx, "code", 4)
		if err != nil {
			return err
		}
		t.Code = code
	}
	if t.AdminCode == "" {
		code, err := uniqueCode(tx, "admin_code", 6)
		if err != nil {
			return err
		}
		t.AdminCode = code
	}
	return nil
}

func randomCode(n int) (string, error) {
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	out := make([]byte, n)
	for i, b := range buf {
		out[i] = codeAlphabet[int(b)%len(codeAlphabet)]
	}
	return string(out), nil
}

func uniqueCode(tx *gorm.DB, column string, n int) (string, error) {
	for i := 0; i < 20; i++ {
		code, err := randomCode(n)
		if err != nil {
			return "", err
		}
		var count int64
		if err := tx.Model(&Tournament{}).Where(column+" = ?", code).Count(&count).Error; err != nil {
			return "", err
		}
		if count == 0 {
			return code, nil
		}
	}
	return "", gorm.ErrInvalidData
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
