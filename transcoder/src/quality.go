package src

type Quality string

const (
	P240     Quality = "240p"
	P360     Quality = "360p"
	P480     Quality = "480p"
	P720     Quality = "720p"
	P1080    Quality = "1080p"
	P1440    Quality = "1440p"
	P4k      Quality = "4k"
	P8k      Quality = "8k"
	Original Quality = "original"
)

var Qualities = []Quality{P240, P360, P480, P720, P1080, P1440, P4k, P8k, Original}

// I'm not entierly sure about the values for bitrates. Double checking would be nice.
func (v Quality) AverageBitrate() uint32 {
	switch v {
	case P240:
		return 400000
	case P360:
		return 800000
	case P480:
		return 1200000
	case P720:
		return 2400000
	case P1080:
		return 4800000
	case P1440:
		return 9600000
	case P4k:
		return 16000000
	case P8k:
		return 28000000
	case Original:
		panic("Original quality must be handled specially")
	}
	panic("Invalid quality value")
}

func (v Quality) MaxBitrate() uint32 {
	switch v {
	case P240:
		return 700000
	case P360:
		return 1400000
	case P480:
		return 2100000
	case P720:
		return 4000000
	case P1080:
		return 8000000
	case P1440:
		return 12000000
	case P4k:
		return 28000000
	case P8k:
		return 40000000
	case Original:
		panic("Original quality must be handled specially")
	}
	panic("Invalid quality value")
}

func (q Quality) Height() uint32 {
	switch q {
	case P240:
		return 240
	case P360:
		return 360
	case P480:
		return 480
	case P720:
		return 720
	case P1080:
		return 1080
	case P1440:
		return 1440
	case P4k:
		return 2160
	case P8k:
		return 4320
	case Original:
		panic("Original quality must be handled specially")
	}
	panic("Invalid quality value")
}

func QualityFromHeight(height uint32) Quality {
	qualities := Qualities
	for _, quality := range qualities {
		if quality.Height() >= height {
			return quality
		}
	}
	return P240
}
