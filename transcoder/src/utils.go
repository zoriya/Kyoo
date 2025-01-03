package src

import (
	"fmt"
	"log"
	"time"
)

func printExecTime(message string, args ...any) func() {
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
