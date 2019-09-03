using AdvancedDLSupport;
using Microsoft.Extensions.Configuration;

namespace Kyoo.InternalAPI.Transcoder
{
    public class Transcoder : ITranscoder
    {
        private readonly ITranscoderAPI api;

        public Transcoder(IConfiguration config)
        {
            string transcoderPath = config.GetValue<string>("plugins");
            api = NativeLibraryBuilder.Default.ActivateInterface<ITranscoderAPI>(transcoderPath);
        }
    }
}
