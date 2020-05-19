using System;

namespace Kyoo.Models.Attributes
{
	public class NotMergableAttribute : Attribute { }

	public interface IOnMerge
	{
		void OnMerge(object merged);
	}
}