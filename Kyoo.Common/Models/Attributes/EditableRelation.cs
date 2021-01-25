using System;

namespace Kyoo.Models.Attributes
{
	[AttributeUsage(AttributeTargets.Property, Inherited = false)]
	public class EditableRelation : Attribute { }
}