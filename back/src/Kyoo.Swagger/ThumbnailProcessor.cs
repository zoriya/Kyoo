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

using Kyoo.Abstractions.Models;
using NJsonSchema;
using NJsonSchema.Generation;

namespace Kyoo.Swagger
{
	/// <summary>
	/// An operation processor to add computed fields of <see cref="IThumbnails"/>.
	/// </summary>
	public class ThumbnailProcessor : ISchemaProcessor
	{
		/// <inheritdoc />
		public void Process(SchemaProcessorContext context)
		{
			if (!context.Type.IsAssignableTo(typeof(IThumbnails)))
				return;
			foreach ((int _, string imageP) in Images.ImageName)
			{
				string image = imageP.ToLower()[0] + imageP[1..];
				context.Schema.Properties.Add(image, new JsonSchemaProperty
				{
					Type = JsonObjectType.String,
					IsNullableRaw = true,
					Description = $"An url to the {image} of this resource. If this resource does not have an image, " +
						$"the link will be null. If the kyoo's instance is not capable of handling this kind of image " +
						$"for the specific resource, this field won't be present."
				});
			}
		}
	}
}
