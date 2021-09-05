using System;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// Remove an property from the serialization pipeline. It will simply be skipped. 
	/// </summary>
	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class SerializeIgnoreAttribute : Attribute { }

	/// <summary>
	/// Remove a property from the deserialization pipeline. The user can't input value for this property.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class DeserializeIgnoreAttribute : Attribute { }

	/// <summary>
	/// Change the way the field is serialized. It allow one to use a string format like formatting instead of the default value.
	/// This can be disabled for a request by setting the "internal" query string parameter to true.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class SerializeAsAttribute : Attribute
	{
		/// <summary>
		/// The format string to use.
		/// </summary>
		public string Format { get; }

		/// <summary>
		/// Create a new <see cref="SerializeAsAttribute"/> with the selected format.
		/// </summary>
		/// <remarks>
		/// The format string can contains any property within {}. It will be replaced by the actual value of the property.
		/// You can also use the special value {HOST} that will put the webhost address.
		/// </remarks>
		/// <example>
		/// The show's poster serialized uses this format string: <code>{HOST}/api/shows/{Slug}/poster</code>
		/// </example>
		/// <param name="format">The format to use</param>
		public SerializeAsAttribute(string format)
		{
			Format = format;
		}
	}
}
