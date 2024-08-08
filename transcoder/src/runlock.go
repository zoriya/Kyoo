package src

import (
	"errors"
	"sync"
)

type RunLock[K comparable, V any] struct {
	running map[K]*Task[V]
	lock    sync.Mutex
}

type Task[V any] struct {
	ready     sync.WaitGroup
	listeners []chan Result[V]
}

type Result[V any] struct {
	ok  V
	err error
}

func NewRunLock[K comparable, V any]() RunLock[K, V] {
	return RunLock[K, V]{
		running: make(map[K]*Task[V]),
	}
}

func (r *RunLock[K, V]) Start(key K) (func() (V, error), func(val V, err error) (V, error)) {
	r.lock.Lock()
	defer r.lock.Unlock()
	task, ok := r.running[key]

	if ok {
		ret := make(chan Result[V])
		task.listeners = append(task.listeners, ret)
		return func() (V, error) {
			res := <-ret
			return res.ok, res.err
		}, nil
	}

	r.running[key] = &Task[V]{
		listeners: make([]chan Result[V], 0),
	}

	return nil, func(val V, err error) (V, error) {
		r.lock.Lock()
		defer r.lock.Unlock()

		task, ok = r.running[key]
		if !ok {
			return val, errors.New("invalid run lock state. aborting.")
		}

		for _, listener := range task.listeners {
			listener <- Result[V]{ok: val, err: err}
			close(listener)
		}
		delete(r.running, key)
		return val, err
	}
}

func (r *RunLock[K, V]) WaitFor(key K) (V, error) {
	r.lock.Lock()
	task, ok := r.running[key]

	if !ok {
		r.lock.Unlock()
		var val V
		return val, nil
	}

	ret := make(chan Result[V])
	task.listeners = append(task.listeners, ret)

	r.lock.Unlock()
	res := <-ret
	return res.ok, res.err
}
