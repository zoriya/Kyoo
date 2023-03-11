// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System.Runtime.InteropServices;
using Kyoo.Abstractions.Models;

namespace Kyoo.Core.Models.Watch
{
	/// <summary>
	/// The list of available stream types.
	/// Attachments are only used temporarily by the transcoder but are not stored in a database.
	/// This is another <see cref="StreamType"/> enum used internally to communicate with ffmpeg.
	/// </summary>
	public enum FTrackType
	{
		/// <summary>
		/// The type of the stream is not known.
		/// </summary>
		Unknown = StreamType.Unknown,

		/// <summary>
		/// The stream is a video.
		/// </summary>
		Video = StreamType.Video,

		/// <summary>
		/// The stream is an audio.
		/// </summary>
		Audio = StreamType.Audio,

		/// <summary>
		/// The stream is a subtitle.
		/// </summary>
		Subtitle = StreamType.Subtitle,

		/// <summary>
		/// The stream is an attachment (a font, an image or something else).
		/// Only fonts are handled by kyoo but they are not saved to the database.
		/// </summary>
		Attachment
	}

	/// <summary>
	/// The unmanaged stream that the transcoder will return.
	/// </summary>
	[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
	public struct FTrack
	{
		/// <summary>
		/// The title of the stream.
		/// </summary>
		public string Title;

		/// <summary>
		/// The language of this stream (as a ISO-639-2 language code)
		/// </summary>
		public string Language;

		/// <summary>
		/// The codec of this stream.
		/// </summary>
		public string Codec;

		/// <summary>
		/// Is this stream the default one of it's type?
		/// </summary>
		[MarshalAs(UnmanagedType.I1)] public bool IsDefault;

		/// <summary>
		/// Is this stream tagged as forced?
		/// </summary>
		[MarshalAs(UnmanagedType.I1)] public bool IsForced;

		/// <summary>
		/// The path of this track.
		/// </summary>
		public string Path;

		/// <summary>
		/// The type of this stream.
		/// </summary>
		public FTrackType Type;

		/// <summary>
		/// Create a track from this stream.
		/// </summary>
		/// <returns>A new track that represent this stream.</returns>
		public Track ToTrack()
		{
			return new()
			{
				Title = Title,
				Language = Language,
				Codec = Codec,
				IsDefault = IsDefault,
				IsForced = IsForced,
				Path = Path,
				Type = Type < FTrackType.Attachment ? (StreamType)Type : StreamType.Unknown,
				IsExternal = false
			};
		}
	}
}
