using System;
using System.Collections.Generic;
using JetBrains.Annotations;

namespace Kyoo.Core.Models.Options
{
	/// <summary>
	/// Options related to tasks
	/// </summary>
	public class TaskOptions
	{
		/// <summary>
		/// The path of this options
		/// </summary>
		public const string Path = "Tasks";
		
		/// <summary>
		/// The number of tasks that can be run concurrently.
		/// </summary>
		public int Parallels { get; set; }

		/// <summary>
		/// The delay of tasks that should be automatically started at fixed times.
		/// </summary>
		[UsedImplicitly]
		public Dictionary<string, TimeSpan> Scheduled { get; set; } = new();
	}
}