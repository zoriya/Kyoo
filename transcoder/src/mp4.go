package src

import (
	"encoding/binary"
	"fmt"
)

// Minimal ISO-BMFF (mp4) box helpers used by the fMP4 segment pipeline.
//
// The segment muxer (`-f segment -segment_format mp4`) writes each segment as a
// fully self-contained fragmented mp4:
//
//	ftyp + moov + sidx + moof + mdat + mfra
//
// For HLS fMP4 we want a single shared init segment (ftyp + moov) referenced by
// `#EXT-X-MAP`, and each media segment reduced to `moof + mdat`. The segment
// muxer also rebases every segment's `tfdt` (baseMediaDecodeTime) to 0, so we
// patch it back to the absolute decode time to keep a continuous timeline
// across independent lazy-window encodes. See docs/FMP4_MIGRATION.md.

type mp4Box struct {
	typ        string
	start      int // offset of the box (including header) in the buffer
	size       int // total box size including header
	payload    int // offset of the box payload (after header)
	payloadEnd int // end offset of the box
}

// iterBoxes walks the direct children boxes in data[start:end] and calls fn for
// each. It does not recurse.
func iterBoxes(data []byte, start, end int, fn func(b mp4Box) error) error {
	i := start
	for i+8 <= end {
		size := int(binary.BigEndian.Uint32(data[i : i+4]))
		typ := string(data[i+4 : i+8])
		payload := i + 8
		switch {
		case size == 1:
			if i+16 > end {
				return fmt.Errorf("mp4: truncated 64-bit box size at %d", i)
			}
			size = int(binary.BigEndian.Uint64(data[i+8 : i+16]))
			payload = i + 16
		case size == 0:
			size = end - i
		}
		if size < 8 || i+size > end {
			return fmt.Errorf("mp4: invalid box %q size %d at %d (end %d)", typ, size, i, end)
		}
		if err := fn(mp4Box{typ: typ, start: i, size: size, payload: payload, payloadEnd: i + size}); err != nil {
			return err
		}
		i += size
	}
	return nil
}

// findBox returns the first direct child box of the given type in data[start:end].
func findBox(data []byte, start, end int, typ string) (mp4Box, bool) {
	var found mp4Box
	ok := false
	_ = iterBoxes(data, start, end, func(b mp4Box) error {
		if !ok && b.typ == typ {
			found = b
			ok = true
		}
		return nil
	})
	return found, ok
}

// extractInitSegment returns the concatenation of the ftyp and moov boxes, which
// forms a valid HLS fMP4 initialization segment.
func extractInitSegment(data []byte) ([]byte, error) {
	var init []byte
	err := iterBoxes(data, 0, len(data), func(b mp4Box) error {
		if b.typ == "ftyp" || b.typ == "moov" {
			init = append(init, data[b.start:b.payloadEnd]...)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	if _, ok := findBox(init, 0, len(init), "moov"); !ok {
		return nil, fmt.Errorf("mp4: no moov box found while extracting init segment")
	}
	return init, nil
}

// stripToFragments returns the concatenation of every moof and mdat box, i.e. the
// media-only portion of the segment with ftyp/moov/sidx/mfra removed. The
// `default_base_moof` movflag makes each moof self-referential (base data offset
// = start of the moof), so dropping the preceding boxes keeps sample offsets valid.
func stripToFragments(data []byte) ([]byte, error) {
	var out []byte
	err := iterBoxes(data, 0, len(data), func(b mp4Box) error {
		if b.typ == "moof" || b.typ == "mdat" {
			out = append(out, data[b.start:b.payloadEnd]...)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	if _, ok := findBox(out, 0, len(out), "moof"); !ok {
		return nil, fmt.Errorf("mp4: no moof box found while stripping segment")
	}
	return out, nil
}

// readMediaTimescale parses the first trak's mdhd timescale from a moov (or from
// a buffer containing one). This is the timescale `tfdt`/baseMediaDecodeTime is
// expressed in.
func readMediaTimescale(data []byte) (uint32, error) {
	moov, ok := findBox(data, 0, len(data), "moov")
	if !ok {
		return 0, fmt.Errorf("mp4: no moov box found while reading timescale")
	}
	trak, ok := findBox(data, moov.payload, moov.payloadEnd, "trak")
	if !ok {
		return 0, fmt.Errorf("mp4: no trak box found while reading timescale")
	}
	mdia, ok := findBox(data, trak.payload, trak.payloadEnd, "mdia")
	if !ok {
		return 0, fmt.Errorf("mp4: no mdia box found while reading timescale")
	}
	mdhd, ok := findBox(data, mdia.payload, mdia.payloadEnd, "mdhd")
	if !ok {
		return 0, fmt.Errorf("mp4: no mdhd box found while reading timescale")
	}
	version := data[mdhd.payload]
	// payload layout: version(1) flags(3) creation modification timescale duration
	// creation/modification are 4 bytes in v0 and 8 bytes in v1.
	var off int
	if version == 1 {
		off = mdhd.payload + 4 + 8 + 8
	} else {
		off = mdhd.payload + 4 + 4 + 4
	}
	if off+4 > mdhd.payloadEnd {
		return 0, fmt.Errorf("mp4: truncated mdhd box")
	}
	return binary.BigEndian.Uint32(data[off : off+4]), nil
}

// patchBaseMediaDecodeTime rewrites the baseMediaDecodeTime of every tfdt box in
// data (in place) to value. There is normally a single tfdt per segment.
func patchBaseMediaDecodeTime(data []byte, value uint64) error {
	patched := false
	err := iterBoxes(data, 0, len(data), func(moof mp4Box) error {
		if moof.typ != "moof" {
			return nil
		}
		return iterBoxes(data, moof.payload, moof.payloadEnd, func(traf mp4Box) error {
			if traf.typ != "traf" {
				return nil
			}
			return iterBoxes(data, traf.payload, traf.payloadEnd, func(tfdt mp4Box) error {
				if tfdt.typ != "tfdt" {
					return nil
				}
				version := data[tfdt.payload]
				off := tfdt.payload + 4 // skip version + flags
				if version == 1 {
					if off+8 > tfdt.payloadEnd {
						return fmt.Errorf("mp4: truncated v1 tfdt box")
					}
					binary.BigEndian.PutUint64(data[off:off+8], value)
				} else {
					if off+4 > tfdt.payloadEnd {
						return fmt.Errorf("mp4: truncated v0 tfdt box")
					}
					binary.BigEndian.PutUint32(data[off:off+4], uint32(value))
				}
				patched = true
				return nil
			})
		})
	})
	if err != nil {
		return err
	}
	if !patched {
		return fmt.Errorf("mp4: no tfdt box found while patching decode time")
	}
	return nil
}
