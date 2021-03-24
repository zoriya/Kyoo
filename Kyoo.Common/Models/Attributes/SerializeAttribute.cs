using System;

namespace Kyoo.Models.Attributes
{
	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class SerializeIgnoreAttribute : Attribute {}
	
	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class DeserializeIgnoreAttribute : Attribute {}

	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class SerializeAsAttribute : Attribute
	{
		public string Format { get; }
		
		public SerializeAsAttribute(string format)
		{
			Format = format;
		}
	}
}