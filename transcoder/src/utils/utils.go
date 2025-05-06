package utils

import (
	"context"
	"errors"
	"fmt"
	"log"
	"sync"
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

// RunJob runs a job in the background and waits for it to complete.
// If the job takes longer than maxJobDuration, it will be cancelled via a separate cancellation context.
// If the waitContext is cancelled, the job will continue running in the background until it completes,
// or the maxJobDuration is reached.
// An error is returned if the provided context is cancelled, or the job errors out.
func RunJob(waitContext context.Context, job func(context.Context) error, maxJobDuration time.Duration) error {
	defer PrintExecTime("background job with max duration %v", maxJobDuration)()

	// Job completion signal, time limit + cancellation, error capturing
	jobDone := make(chan struct{})
	jobClose := sync.OnceFunc(func() { close(jobDone) })
	defer jobClose()

	// TODO this should be cancelled via a root cancellation context (listen for OS signals, etc.)
	jobCtx, cancel := context.WithTimeout(context.TODO(), maxJobDuration)

	var jobErr error

	// Start the job
	go func() {
		jobErr = job(jobCtx)

		// Log the error if the job fails and the caller has already cancelled the context
		// This ensures that errors are not completely lost if the outer function has already returned
		if jobErr != nil && waitContext.Err() != nil {
			log.Printf("Background job failed: %v", jobErr)
		}

		// Signal that the job is done
		jobClose()
		cancel()
	}()

	// Wait for the job to complete, or the provided context to be cancelled.
	// If the context is cancelled, the job will continue running in the background.
	select {
	case <-jobDone:
	case <-waitContext.Done():
		return fmt.Errorf("context was cancelled while waiting for the job to complete: %w", waitContext.Err())
	}

	return jobErr
}
