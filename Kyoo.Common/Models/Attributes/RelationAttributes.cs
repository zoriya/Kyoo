using System;

namespace Kyoo.Models.Attributes
{
	[AttributeUsage(AttributeTargets.Property, Inherited = false)]
	public class EditableRelationAttribute : Attribute { }
	
	[AttributeUsage(AttributeTargets.Property)]
	public class LoadableRelationAttribute : Attribute { }
}