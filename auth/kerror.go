package main

type KError struct {
	Status  int    `json:"status" example:"404"`
	Message string `json:"message" example:"No user found with this id"`
	Details any    `json:"details"`
}
