using System;

namespace Kyoo.Models.Attributes
{
	[AttributeUsage(AttributeTargets.Property, Inherited = false)]
	public class EditableRelationAttribute : Attribute { }

	[AttributeUsage(AttributeTargets.Property)]
	public class LoadableRelationAttribute : Attribute
	{
		public string RelationID { get; }
		
		public LoadableRelationAttribute() {}

		public LoadableRelationAttribute(string relationID)
		{
			RelationID = relationID;
		}
	}

	[AttributeUsage(AttributeTargets.Property)]
	public class LinkRelationAttribute : Attribute
	{
		public string Relation { get; }

		public LinkRelationAttribute(string relation)
		{
			Relation = relation;
		}
	}
}