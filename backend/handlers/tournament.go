package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sueca-backend/models"
)

type TournamentHandler struct {
	db *gorm.DB
}

func NewTournamentHandler(db *gorm.DB) *TournamentHandler {
	return &TournamentHandler{db: db}
}

func (h *TournamentHandler) List(c *gin.Context) {
	var items []models.Tournament
	if err := h.db.Order("created_at desc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *TournamentHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var t models.Tournament
	if err := h.db.Preload("Teams").Preload("Matches").First(&t, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, t)
}

func (h *TournamentHandler) Create(c *gin.Context) {
	var t models.Tournament
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.db.Create(&t).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, t)
}

func (h *TournamentHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var existing models.Tournament
	if err := h.db.First(&existing, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	var patch models.Tournament
	if err := c.ShouldBindJSON(&patch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	patch.ID = existing.ID
	patch.CreatedAt = existing.CreatedAt
	if err := h.db.Save(&patch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, patch)
}

func (h *TournamentHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.Tournament{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
