using System;

namespace Kyoo.Models.Attributes
{
	/// <summary>
	/// Specify permissions needed for the API.
	/// </summary>
	[AttributeUsage(AttributeTargets.Method)]
	public class PermissionAttribute : Attribute
	{
		public enum Kind
		{
			Read,
			Write,
			Admin
		}
		
		public PermissionAttribute(string type, Kind permission)
		{
			
		}
	}
}