package src

type Quality int8

const (
	P240 Quality = iota
	P360
	P480
	P720
	P1080
	P1440
	P4k
	P8k
	Original
)

func (q Quality) String() string {
	switch q {
	case P240:
		return "240p"
	case P360:
		return "360p"
	case P480:
		return "480p"
	case P720:
		return "720p"
	case P1080:
		return "1080p"
	case P1440:
		return "1440p"
	case P4k:
		return "4k"
	case P8k:
		return "8k"
	case Original:
		return "Original"
	}
	panic("Invalid quality value")
}
