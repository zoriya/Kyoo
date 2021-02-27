using System;

namespace Kyoo.Models.Attributes
{
	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class SerializeIgnoreAttribute : Attribute {}
	
	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class DeserializeIgnoreAttribute : Attribute {}
}