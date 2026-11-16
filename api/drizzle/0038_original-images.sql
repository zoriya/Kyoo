-- collections had no images in `original` until now.
update kyoo.shows set original = '{"poster":null,"thumbnail":null,"banner":null,"logo":null}'::jsonb || original;
