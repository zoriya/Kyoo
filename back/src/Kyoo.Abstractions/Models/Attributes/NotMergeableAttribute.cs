// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;

namespace Kyoo.Abstractions.Models.Attributes;

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
