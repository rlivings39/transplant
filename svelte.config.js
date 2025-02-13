import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess({
		scss: {
			prependData: '@use "src/lib/styles/custom-pico.scss" as *;'
		}
	}),
	kit: {
		alias: {
			$lib: 'src/lib'
		  },
		adapter: adapter()
	}
};

export default config;
