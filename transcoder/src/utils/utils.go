package utils

import (
	"errors"
	"fmt"
	"log"
	"time"
)

func PrintExecTime(message string, args ...any) func() {
	msg := fmt.Sprintf(message, args...)
	start := time.Now()
	log.Printf("Running %s", msg)

	return func() {
		log.Printf("%s finished in %s", msg, time.Since(start))
	}
}

func Filter[E any](s []E, f func(E) bool) []E {
	s2 := make([]E, 0, len(s))
	for _, e := range s {
		if f(e) {
			s2 = append(s2, e)
		}
	}
	return s2
}

// Count returns the number of elements in s that are equal to e.
func Count[S []E, E comparable](s S, e E) int {
	var n int
	for _, v := range s {
		if v == e {
			n++
		}
	}
	return n
}

// CleanupWithErr runs a cleanup function and checks if it returns an error.
// If the cleanup function returns an error, it is joined with the original error
// and assigned to the original error pointer.
func CleanupWithErr(err *error, fn func() error, msg string, args ...any) {
	cleanupErr := fn()
	if err == nil {
		return
	}

	if cleanupErr != nil {
		*err = fmt.Errorf("%s: %w", fmt.Sprintf(msg, args...), cleanupErr)
	}
	*err = errors.Join(*err, cleanupErr)
}
