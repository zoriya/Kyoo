namespace Kyoo.Models
{
	/// <summary>
	/// A chapter to split an episode in multiple parts.
	/// </summary>
	public class Chapter
	{
		/// <summary>
		/// The start time of the chapter (in second from the start of the episode).
		/// </summary>
		public float StartTime { get; set; }
		
		/// <summary>
		/// The end time of the chapter (in second from the start of the episode)&.
		/// </summary>
		public float EndTime { get; set; }
		
		/// <summary>
		/// The name of this chapter. This should be a human-readable name that could be presented to the user.
		/// There should be well-known chapters name for commonly used chapters.
		/// For example, use "Opening" for the introduction-song and "Credits" for the end chapter with credits.  
		/// </summary>
		public string Name { get; set; }

		/// <summary>
		/// Create a new <see cref="Chapter"/>.
		/// </summary>
		/// <param name="startTime">The start time of the chapter (in second)</param>
		/// <param name="endTime">The end time of the chapter (in second)</param>
		/// <param name="name">The name of this chapter</param>
		public Chapter(float startTime, float endTime, string name)
		{
			StartTime = startTime;
			EndTime = endTime;
			Name = name;
		}
	}
}