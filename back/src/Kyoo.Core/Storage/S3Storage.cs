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
using Amazon.S3;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Core.Storage;

/// <summary>
/// S3-backed storage.
/// </summary>
public class S3Storage(IAmazonS3 s3Client, IConfiguration configuration) : IStorage
{
	public const string S3BucketEnvironmentVariable = "S3_BUCKET_NAME";

	public Task<bool> DoesExist(string path)
	{
		return s3Client
			.GetObjectMetadataAsync(_GetBucketName(), path)
			.ContinueWith(t =>
			{
				if (t.IsFaulted)
					return false;

				return t.Result.HttpStatusCode == System.Net.HttpStatusCode.OK;
			});
	}

	public async Task<Stream> Read(string path)
	{
		var response = await s3Client.GetObjectAsync(_GetBucketName(), path);
		return response.ResponseStream;
	}

	public Task Write(Stream reader, string path)
	{
		return s3Client.PutObjectAsync(
			new Amazon.S3.Model.PutObjectRequest
			{
				BucketName = _GetBucketName(),
				Key = path,
				InputStream = reader
			}
		);
	}

	public Task Delete(string path)
	{
		return s3Client.DeleteObjectAsync(_GetBucketName(), path);
	}

	private string _GetBucketName()
	{
		var bucketName = configuration.GetValue<string>(S3BucketEnvironmentVariable);
		if (string.IsNullOrEmpty(bucketName))
			throw new InvalidOperationException("S3 bucket name is not configured.");

		return bucketName;
	}
}
