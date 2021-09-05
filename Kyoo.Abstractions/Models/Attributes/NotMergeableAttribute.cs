using System;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// Specify that a property can't be merged.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property)]
	public class NotMergeableAttribute : Attribute { }

	/// <summary>
	/// An interface with a method called when this object is merged.
	/// </summary>
	public interface IOnMerge
	{
		/// <summary>
		/// This function is called after the object has been merged.
		/// </summary>
		/// <param name="merged">The object that has been merged with this.</param>
		void OnMerge(object merged);
	}
}
