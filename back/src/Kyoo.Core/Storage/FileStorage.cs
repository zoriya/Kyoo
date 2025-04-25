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
using System.IO;
using System.Threading.Tasks;

namespace Kyoo.Core.Storage;

/// <summary>
/// File-backed storage.
/// </summary>
public class FileStorage : IStorage
{
	public Task<bool> DoesExist(string path) => Task.FromResult(File.Exists(path));

	public async Task<Stream> Read(string path) =>
		await Task.FromResult(File.Open(path, FileMode.Open, FileAccess.Read));

	public async Task Write(Stream reader, string path)
	{
		Directory.CreateDirectory(
			Path.GetDirectoryName(path) ?? throw new InvalidOperationException()
		);
		await using Stream file = File.Create(path);
		await reader.CopyToAsync(file);
	}

	public Task Delete(string path)
	{
		if (File.Exists(path))
			File.Delete(path);

		return Task.CompletedTask;
	}
}
