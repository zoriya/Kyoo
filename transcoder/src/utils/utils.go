package utils

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"runtime/debug"
	"time"

	"go.opentelemetry.io/otel"
)

var tracer = otel.Tracer("")

// RecoverPanic recovers from a panic in a background goroutine and logs it with
// a stack trace, instead of letting it crash the whole process (Go does not
// recover panics in goroutines). Use as the first deferred call in a goroutine:
//
//	go func() {
//		defer utils.RecoverPanic(ctx, "extracting thumbnails")
//		...
//	}()
func RecoverPanic(ctx context.Context, label string) {
	if r := recover(); r != nil {
		slog.ErrorContext(ctx, "recovered from panic in background task",
			"task", label, "panic", fmt.Sprintf("%v", r), "stack", string(debug.Stack()))
	}
}

func PrintExecTime(ctx context.Context, message string, args ...any) func() {
	msg := fmt.Sprintf(message, args...)
	if ctx == nil {
		ctx = context.Background()
	}
	_, span := tracer.Start(ctx, msg)
	start := time.Now()

	return func() {
		slog.InfoContext(ctx, fmt.Sprintf("finished %s", msg), "duration", time.Since(start))
		span.End()
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
