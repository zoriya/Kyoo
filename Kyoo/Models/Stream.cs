using System.Runtime.InteropServices;
using Kyoo.Models.Attributes;

namespace Kyoo.Models.Watch
{
	/// <summary>
	/// The unmanaged stream that the transcoder will return.
	/// </summary>
	[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
	public class Stream
	{
		/// <summary>
		/// The title of the stream.
		/// </summary>
		public string Title { get; set; }
		
		/// <summary>
		/// The language of this stream (as a ISO-639-2 language code)
		/// </summary>
		public string Language { get; set; }
		
		/// <summary>
		/// The codec of this stream.
		/// </summary>
		public string Codec { get; set; }
		
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
		[SerializeIgnore] public string Path { get; set; }
		
		/// <summary>
		/// The type of this stream.
		/// </summary>
		[SerializeIgnore] public StreamType Type { get; set; }


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
				Type = Type,
				IsExternal = false
			};
		}
	}
}