import "./globals.css";

/**
 * @typedef {Object} RootLayoutProps
 * @property {React.ReactNode} children
 */

/**
 * Root layout component
 * @param {RootLayoutProps} props
 * @returns {JSX.Element}
 */

export const metadata = {
	title: "단어장",
	description: "영어와 일본어 단어를 학습하는 웹 애플리케이션",
}

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<div className="min-h-screen bg-gray-100">
					<header className="bg-white shadow">
						<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
							<h1 className="text-3xl font-bold text-gray-900">단어장</h1>
						</div>
					</header>
					<main>
						<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
							{children}
						</div>
					</main>
				</div>
			</body>
		</html>
	);
}