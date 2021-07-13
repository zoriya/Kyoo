using System;
using JetBrains.Annotations;
using Kyoo.Models.Attributes;

namespace Kyoo.Common.Models.Attributes
{
	/// <summary>
	/// An attribute to mark Link properties on resource. 
	/// </summary>
	[AttributeUsage(AttributeTargets.Property)]
	[MeansImplicitUse]
	public class LinkAttribute : SerializeIgnoreAttribute { }
}